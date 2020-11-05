#include <data.h>
#include <iostream>
#include <sstream>      // std::stringstream
#include <cmath>       /* log2 */
#include <iterator>
#include <algorithm>

using namespace std;


ASTNode::ASTNode(){
}

ASTNode::ASTNode(const std::string & key){
    this->key = key;
    this->_isLeaf = true;
}

ASTNode::ASTNode(const std::string & oper, const std::vector<ASTNode>& children){
    this->_isLeaf = false;
    this->oper = oper;
    this->children = children;
}
ASTNode::ASTNode(const ASTNode & origin){
    this->_isLeaf = origin._isLeaf;
    this->key = origin.key;
    this->oper = origin.oper;
    this->children = origin.children;
}

bool ASTNode::isLeaf() const{
    return this->_isLeaf;
};

void ASTNode::toPrefix(std::stringstream & output) const{
    if(this->isLeaf()){
        output << key;
        return;
    }

    output << oper.c_str() << children.size() << '|';

    for (auto &it : this->children) // access by reference to avoid copying
    {
        it.toPrefix(output);
    }
}


void ASTNode::toInfix(std::stringstream & output) const{
    if(this->isLeaf()){
        output << key;
        return;
    }
    
    output << "(";
    bool is_first = true;
    for (auto &it : this->children) // access by reference to avoid copying
    {
        if(is_first){
            is_first = false;
        }else{
            output << this->oper;
        }
        it.toInfix(output);
    }
    output << ")";
}


bool ASTNode::normalize(){
    //convert n-ary node to the binary
    //change
    return true;
}

void ASTNode::stats(EqStats& data) const{
    //convert n-ary node to the binary
    if(this->isLeaf()){
//        cout << "STATS LEAF"<<endl;
        if( data.keys.find(this->key) == data.keys.end() ){
            data.keys[this->key] = 0;
        }
        data.keys[this->key]++;

    }else{
        if( data.opers.find(this->oper) == data.keys.end() ){
            data.opers[this->oper] = 0;
        }
        data.opers[this->oper]++;

        for (auto &it : this->children){
            it.stats(data);
        }
    }
}


Equation::Equation(const ASTNode& node):ast(node){
}

void Equation::toInfix(std::stringstream & output) const{
    ast.toInfix(output);
}

void Equation::toPrefix(std::stringstream & output) const{
    ast.toPrefix(output);
}

void Equation::normalize(){
    ast.normalize();
}

float Equation::score() const{
    EqStats st;
    ast.stats(st);
    return st.score();
}

float EqStats::score() const{
    int cntOpers = 0;
    int cntKeys = 0;

    int* cntOpersPt = &cntOpers;
    std::for_each(opers.begin(), opers.end(),
            [cntOpersPt](std::pair<std::string, int> element){
                *cntOpersPt += element.second;
    });

    int* cntKeysPt = &cntKeys;
    std::for_each(keys.begin(), keys.end(),
            [cntKeysPt](std::pair<std::string, int> element){
                *cntKeysPt += element.second;
    });

    float entropyOpers = 0;
    float* entropyOpersPt = &entropyOpers;

    std::for_each(opers.begin(), opers.end(),
            [entropyOpersPt, cntOpers](std::pair<std::string, int> element){
                int cnt = element.second;
                float prob = (float)cnt / (float)cntOpers;
                *entropyOpersPt -= prob * log2(prob);
    });

    float entropyKeys = 0;
    float* entropyKeysPt = &entropyKeys;
    std::for_each(keys.begin(), keys.end(),
            [entropyKeysPt, cntKeys](std::pair<std::string, int> element){
                int cnt = element.second;
                float prob = (float)cnt / (float)cntKeys;
                *entropyKeysPt -= prob * log2(prob);
    });

    return entropyKeys * cntKeys + entropyOpers * cntOpers;


    // std::for_each(opers.begin(), opers.end(),
    //         [](std::pair<std::string, int> element){
    //             // Accessing KEY from element
    //             std::string oper = element.first;
    //             // Accessing VALUE from element.
    //             int count = element.second;
                
    //             std::cout<<word<<" :: "<<count<<std::endl;
    // });
};
